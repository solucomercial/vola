import { db } from "./index";
import { users } from "./schema";
import "dotenv/config";

async function main() {
  console.log("Iniciando seed...");

  const mockUsers = [
    {
      id: "1",
      name: "João Silva",
      email: "joao@solucoes.com",
      role: "requester" as const,
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@solucoes.com",
      role: "approver" as const,
    },
    {
      id: "3",
      name: "Carlos Admin",
      email: "carlos@solucoes.com",
      role: "admin" as const,
    },
    {
      id: "4",
      name: "Ana Compradora",
      email: "ana@solucoes.com",
      role: "buyer" as const,
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