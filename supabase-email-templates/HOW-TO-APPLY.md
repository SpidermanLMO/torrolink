# How to Apply the Branded Magic Link Email

## Steps

1. Go to **supabase.com** → your project → **Authentication → Email Templates**
2. Select **"Magic Link"** from the template list
3. Change the **Subject** to:
   ```
   Sign in to your Torrolink portal
   ```
4. Delete the existing HTML in the body editor
5. Copy the entire contents of `magic-link.html` and paste it in
6. Click **Save**

## Template Variable

The template uses `{{ .ConfirmationURL }}` — this is Supabase's built-in variable that gets replaced with the actual magic link URL when the email is sent. Do not change it.

## Testing

After saving, go to **Authentication → Users** → find a test user → click the three-dot menu → **Send magic link** to test the email looks correct.

## Notes

- The "From" address is controlled by your Resend domain settings (already verified as orders@torrolink.com)
- The email renders in both light and dark mode email clients
- Mobile-responsive at 560px breakpoint
