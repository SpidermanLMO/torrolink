"""
LUCIUS — Fix create_beta profile INSERT → idempotent check

Bug: create_beta always does a hard INSERT on profiles.
If called twice (e.g. first attempt crashed on OWNER_EMAIL after profile
was already created), the second attempt hits a unique constraint and
returns a 500 with a Supabase error.

Fix: check for existing profile by customer_id first. If found, reuse it.
Only insert if no profile exists yet. This makes create_beta fully
idempotent — safe to retry as many times as needed.
"""

path = "/sessions/nice-vigilant-sagan/mnt/Torrolink/netlify/functions/admin.js"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

old = """        // Create profile
        const bHandle = await _uniqueHandle(bBiz);
        const bCode   = await _uniqueCode();
        const { data: bProf, error: bpErr } = await supabaseAdmin.from("profiles")
          .insert({ customer_id: betaCustId, handle: bHandle, code: bCode, business_name: bBiz, is_active: true, has_metrics: true })
          .select("id, handle, code").single();
        if (bpErr) return json(500, { error: bpErr.message });"""

new = """        // Create profile (idempotent — reuse if already created on a prior attempt)
        let bProf;
        const { data: existProf } = await supabaseAdmin.from("profiles")
          .select("id, handle, code").eq("customer_id", betaCustId).maybeSingle();
        if (existProf) {
          bProf = existProf;
        } else {
          const bHandle = await _uniqueHandle(bBiz);
          const bCode   = await _uniqueCode();
          const { data: newBProf, error: bpErr } = await supabaseAdmin.from("profiles")
            .insert({ customer_id: betaCustId, handle: bHandle, code: bCode, business_name: bBiz, is_active: true, has_metrics: true })
            .select("id, handle, code").single();
          if (bpErr) return json(500, { error: bpErr.message });
          bProf = newBProf;
        }"""

count = src.count(old)
if count == 0:
    print("ERROR: pattern not found")
else:
    src = src.replace(old, new, 1)
    print(f"OK: profile insert → idempotent check ({count} match)")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

import subprocess
r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
print("node --check:", "OK" if r.returncode == 0 else r.stderr[:300])
print("Done.")
