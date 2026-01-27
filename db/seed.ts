import { db } from "./index";
import { users } from "./schema";
import "dotenv/config";

async function main() {
  console.log("Iniciando seed...");

  const mockUsers = [
    {
      id: "1",
      name: "David",
      email: "david@solucoesterceirizadas.com.br",
      password: "Solu@123456",
      role: "requester" as const,
    },
    {
      id: "2",
      name: "Ademir",
      email: "ademir@solucoesterceirizadas.com.br",
      password: "Solu@123456",
      role: "approver" as const,
    },
    {
      id: "3",
      name: "Guilherme",
      email: "guilherme.machado@solucoesterceirizadas.com.br",
      password: "Solu@123456",
      role: "admin" as const,
    },
    {
      id: "4",
      name: "Cristiane",
      email: "cristiane@solucoesterceirizadas.com.br",
      password: "Solu@123456",
      role: "buyer" as const,
    },
    {
      id: "5",
      name: "Clodoaldo",
      email: "clodoaldo@solucoesterceirizadas.com.br",
      password: "Solu@123456",
      role: "approver" as const,
    },
  ];

  for (const user of mockUsers) {
    await db
      .insert(users)
      .values(user)
      .onConflictDoNothing();
  }

  console.log("Seed concluído: Usuários inseridos/atualizados.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro durante o seed:", err);
  process.exit(1);
});