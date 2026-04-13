import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { Sequelize, DataTypes } from 'sequelize';

// 1) Conexion a SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// 2) Modelos
const Autor = sequelize.define(
  'Autor',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nacionalidad: {
      type: DataTypes.STRING,
      allowNull: false
    },
    edad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  },
  {
    tableName: 'autores',
    timestamps: false
  }
);

const Libro = sequelize.define(
  'Libro',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    genero: {
      type: DataTypes.STRING,
      allowNull: false
    },
    paginas: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    publicadoEn: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isbn: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    tableName: 'libros',
    timestamps: false
  }
);

// 3) Relaciones
Autor.hasMany(Libro, { foreignKey: 'autorId', as: 'libros' });
Libro.belongsTo(Autor, { foreignKey: 'autorId', as: 'autor' });

// 4) Datos iniciales
async function seedData() {
  const totalAutores = await Autor.count();

  if (totalAutores === 0) {
    const autor1 = await Autor.create({
      nombre: 'Gabriel García Márquez',
      nacionalidad: 'Colombiana',
      edad: 87,
      email: 'gabriel@example.com'
    });

    const autor2 = await Autor.create({
      nombre: 'Isabel Allende',
      nacionalidad: 'Chilena',
      edad: 81,
      email: 'isabel@example.com'
    });

    await Libro.bulkCreate([
      {
        titulo: 'Cien años de soledad',
        genero: 'Novela',
        paginas: 417,
        publicadoEn: 1967,
        isbn: 'ISBN-001',
        disponible: true,
        autorId: autor1.id
      },
      {
        titulo: 'El amor en los tiempos del cólera',
        genero: 'Romance',
        paginas: 348,
        publicadoEn: 1985,
        isbn: 'ISBN-002',
        disponible: false,
        autorId: autor1.id
      },
      {
        titulo: 'La casa de los espíritus',
        genero: 'Realismo mágico',
        paginas: 433,
        publicadoEn: 1982,
        isbn: 'ISBN-003',
        disponible: true,
        autorId: autor2.id
      }
    ]);
  }
}

// 5) Esquema GraphQL
const typeDefs = `#graphql
  """
  Representa a un autor disponible en la base de datos.
  """
  type Autor {
    id: Int!
    nombre: String!
    nacionalidad: String!
    edad: Int!
    email: String!
    libros: [Libro!]!
  }

  """
  Representa a un libro registrado en la base de datos.
  """
  type Libro {
    id: Int!
    titulo: String!
    genero: String!
    paginas: Int!
    publicadoEn: Int!
    isbn: String!
    disponible: Boolean!
    autor: Autor!
  }

  type Query {
    autores: [Autor!]!
    autor(id: Int!): Autor
    libros: [Libro!]!
    libro(id: Int!): Libro
  }
`;

// 6) Resolvers
const resolvers = {
  Query: {
    autores: async () => await Autor.findAll(),
    autor: async (_, { id }) => await Autor.findByPk(id),
    libros: async () => await Libro.findAll(),
    libro: async (_, { id }) => await Libro.findByPk(id)
  },

  Autor: {
    libros: async (autor) => await Libro.findAll({ where: { autorId: autor.id } })
  },

  Libro: {
    autor: async (libro) => await Autor.findByPk(libro.autorId)
  }
};

// 7) Inicializacion
await sequelize.sync();
await seedData();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true
});

const port = process.env.PORT || 4000;

const { url } = await startStandaloneServer(server, {
  listen: { port }
});

console.log(`Servidor GraphQL listo en: ${url}`);