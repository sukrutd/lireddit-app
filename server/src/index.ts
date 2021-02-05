import { MikroORM } from '@mikro-orm/core';
import mikroConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/posts';
import { UserResolver } from './resolvers/user';

const main = async () => {
	const orm = await MikroORM.init(mikroConfig);
	await orm.getMigrator().up();

	const app = express();

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false
		}),
		context: () => ({ em: orm.em })
	});
	apolloServer.applyMiddleware({ app });

	const port = process.env.PORT || 5000;
	app.listen(port, () => {
		console.log(`Server running on port: ${port}`);
	});
};

main().catch((error) => {
	console.log(error);
});
