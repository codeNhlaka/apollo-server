import { ApolloServer, gql, IResolvers } from "apollo-server";
import { DynamoDB } from "aws-sdk";

class dynamodbAPI {
    static async getBookByAuthor(author: string){
      const params = {
        TableName: "books",
        IndexName: "author-index",
        ExpressionAttributeValues: {
          ":v1": {
            S: author
           }
         },
        KeyConditionExpression: "author = :v1"
      }

      try {
        const dynamoDB = new DynamoDB({region: "us-east-2"});
        const resp = await dynamoDB.query(params).promise();

        if (resp.Items){
          let item = resp.Items[0];
          return DynamoDB.Converter.unmarshall(item);
        }

      } catch(error){
        console.log(error, error.stack);
        return;
      }
    }

    static async getBooks(){
        const params = {
            TableName: "books"
        }

        try {
          const dynamoDB = new DynamoDB({region: "us-east-2"});
          const resp = await dynamoDB.scan(params).promise();
          const fetchedItems: object[] = [];

          if (resp.Items){
            resp.Items.forEach(item => {
              fetchedItems.push(DynamoDB.Converter.unmarshall(item));
            });

            return fetchedItems;
          }

          
        } catch(error){
          console.log(error, error.stack);
          return;
        }
    }

    static async getBook(id: string){
        const dynamoDB = new DynamoDB({region: "us-east-2"});

        const params = {
            TableName: "books",
            Key: {
                "id" : {
                    S: id
                }
            }
        }

        try {
            const result = await dynamoDB.getItem(params).promise();
            if (result.Item){
                const item = DynamoDB.Converter.unmarshall(result.Item);
                return item;
            }
        } catch(error){
            console.log(error, error.stack);
            return;
        }
    }
}

const typeDefs = gql`
  type Book {
    title: String
    author: String
    id: String
  }

  type Query {
    getBooks: [Book],
    getBook(id: String!): Book,
    getBookByAuthor(author: String!): Book
  }
`;

const resolvers: IResolvers = {
    Query: {
      getBooks: () => {
          return dynamodbAPI.getBooks();
      },
      getBook: (_,{ id }, __) => {
            return dynamodbAPI.getBook(id);
      },
      getBookByAuthor: (_, { author }, __) => {
        return dynamodbAPI.getBookByAuthor(author);
      }
    },
  };

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});