import passport from 'passport';
import { Strategy as GithubStrategy} from 'passport-github2';
import type { Profile } from 'passport-github2';
import type { VerifyCallback } from 'passport-oauth2';  
import { UserService } from '../services/user.service.js';
import type { GithubProfileInput, AuthResponse } from '../services/user.service.js';


passport.use( 
    new GithubStrategy(
        {
            clientID: process.env.CLIENT_ID as string,
            clientSecret: process.env.CLIENT_SECRET as string,
            callbackURL: process.env.GITHUB_CALLBACK_URL as string,
        },
        async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
            try {
                let email = profile.emails?.[0]?.value;
                if (!email) {
          const res = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `token ${accessToken}`,
              'User-Agent': 'codeclash-app' // GitHub API requires a User-Agent header
            }
          });

          if (res.ok) {
            const emails = await res.json() as { email: string; primary: boolean; verified: boolean }[];
            const primaryEmail = emails.find(e => e.primary && e.verified);
            email = primaryEmail?.email;
          }
        }

        if (!email) {
          return done(
            new Error('Could not retrieve a verified email from GitHub. Please verify an email on your GitHub account.'),
            undefined
          );
        }

                const avatarUrl = profile.photos?.[0]?.value;
                const profileInput: GithubProfileInput = {
                    githubId: profile.id,
                    username: profile.username || `gh_${profile.id}`,
                    email,
                    ...(avatarUrl ? { avatarUrl } : {}),
                };

                const authResponse: AuthResponse = await UserService.loginOrRegisterWithGithub(profileInput);
                return done(null, authResponse as any);
            } catch (error) {
                return done(error as Error, undefined);
            }
        }
));


passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserService.getUserProfile(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;