interface Person {
  name: string;
  age: number;
  email?: string;
}

type PersonKeys = keyof Person; // "name" | "age" | "email"

const P: PersonKeys = 'age';
console.log('P', P);
