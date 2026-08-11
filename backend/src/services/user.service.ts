import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "../config/db.js";
import type { User } from "@prisma/client";

export interface RegisterEmailInput {
    username: string;
    email: string;
    password: string;
}

export interface LoginEmailInput {
    email: string;
    password: string;
}

export interface GithubProfileInput {
    githubId: string;
    username: string;
    email: string;
    avatarUrl?: string;
}


export type PublicUser = Omit<User, 'password'>;

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

export class UserService {

    static async registerWithEmail(input: RegisterEmailInput): Promise<AuthResponse> {
        const existingEmailUser = await prisma.user.findUnique({
            where : { email: input.email }
        });
        if(existingEmailUser) {
            throw new Error("Email already exists");
        }
       
    
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const newUser = await prisma.user.create({
            data: {
                username: input.username,
                email: input.email,
                password: hashedPassword,
                avatarUrl: `https://avatars.dicebear.com/api/initials/${input.username}.svg`,
            }
        });
        const token = this.generateToken(newUser.id, newUser.email);
        return { user: this.sanitizeUser(newUser), token };
    }

    static async loginWithEmail(input: LoginEmailInput): Promise<AuthResponse> {
        const user = await prisma.user.findUnique({
            where: { email: input.email },
        });
        if (!user) {
            throw new Error("Invalid email or password");
        }
        if(!user.password) {
            throw new Error("User registered with GitHub. Please login using GitHub.");
        }
        const isPasswordValid = await bcrypt.compare(input.password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        const token = this.generateToken(user.id, user.email);
        return { user: this.sanitizeUser(user), token };
    }


    static async loginOrRegisterWithGithub(profile: GithubProfileInput): Promise<AuthResponse> {
        let user = await prisma.user.findUnique({
            where: { githubId: profile.githubId },
        });
        if(user) {
            const token = this.generateToken(user.id, user.email);
            return { user: this.sanitizeUser(user), token };
        }

        user = await prisma.user.findUnique({
            where: { email: profile.email },
        });

        if(user) {
            throw new Error("An account with this email already exists. Please sign in using your existing method.");
        }

        let finalUsername = profile.username;
        const takenUsername = await prisma.user.findUnique({
        where: { username: finalUsername },
        });
        if(takenUsername) {
            finalUsername = `${profile.username}_${Math.floor(Math.random() * 10000)}`;
        }
        const newUser = await prisma.user.create({
            data: {
                githubId: profile.githubId,
                username: finalUsername,
                email: profile.email,
                avatarUrl: profile.avatarUrl || `https://avatars.dicebear.com/api/initials/${finalUsername}.svg`,
                password: null,
            }
        });
        const token = this.generateToken(newUser.id, newUser.email);
        return { user: this.sanitizeUser(newUser), token };     
    }
 

    static async getUserProfile(userId: string): Promise<PublicUser> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return this.sanitizeUser(user);
    }

    static async updateUserProfile(userId: string, updates: Partial<PublicUser>): Promise<PublicUser> {
        const user = await prisma.user.update({
            where: { id: userId },
            data: updates,
        });

        return this.sanitizeUser(user);
    }

    
    private static generateToken(userId: string, email: string): string {
        const secret = process.env.JWT_SECRET || "Aryan@123";
        const token = jwt.sign({userId, email}, secret, {expiresIn: '7d'});
        return token;
    }

    private static sanitizeUser(user: User): PublicUser {
        const { password:_, ...publicUser } = user;
        return publicUser;
    }

}