import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from 'type-graphql';
import { MyContext } from '../types';
import { User } from '../entities/User';
import argon2 from 'argon2';

@InputType()
class UserInput {
	@Field()
	username: string;

	@Field()
	password: string;
}

@ObjectType()
class FieldError {
	@Field()
	message: string;
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

@Resolver()
export class UserResolver {
	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: UserInput,
		@Ctx() { em }: MyContext
	): Promise<UserResponse> {
		const { username, password } = options;

		if (username.length < 3) {
			return { errors: [{ message: 'Username must be at least 3 characters long.' }] };
		}

		if (password.length < 8) {
			return { errors: [{ message: 'Password must be at least 8 characters long.' }] };
		}

		const hashedPassword = await argon2.hash(options.password);
		const user = em.create(User, { username: options.username, password: hashedPassword });

		try {
			await em.persistAndFlush(user);
		} catch (error) {
			if (error && error.detail.includes('already exists')) {
				return { errors: [{ message: 'Username already exists.' }] };
			}
		}

		return { user };
	}

	@Mutation(() => UserResponse)
	async login(@Arg('options') options: UserInput, @Ctx() { em }: MyContext): Promise<UserResponse> {
		const user = await em.findOne(User, { username: options.username });
		const errorObj = { message: 'Invalid credentials.' };
		if (!user) return { errors: [errorObj] };

		const validPassword = await argon2.verify(user.password, options.password);
		if (!validPassword) return { errors: [errorObj] };

		return { user };
	}
}
