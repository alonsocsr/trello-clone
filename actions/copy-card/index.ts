"use server";

import { auth } from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/create-safe-action";
import { CopyCard } from "./schema";

const handler = async (data: InputType): Promise<ReturnType> => {
  const {userId, orgId} = auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, boardId } = data;
  let card;

  try {
    const CardToCopy = await db.card.findUnique({
      where: {
        id,
        list: {
          board: {
            orgId,
          },
        },
      },
    });
    
    if (!CardToCopy) {
      return { error: "Card not Found" };
    }

    const lastCard = await db.card.findFirst({
      where: { listId: CardToCopy.listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = lastCard ? lastCard.order + 1 : 1;

    card = await db.card.create({
      data: {
        title: `${CardToCopy.title} - Copy`,
        description: CardToCopy.description,
        order: newOrder,
        listId: CardToCopy.listId
      },
    });

  } catch (error) {
    return {
      error: "Failed to copy"
    }
  }

  revalidatePath(`/board/${boardId}`);
  return { data: card }
};

export const copyCard = createSafeAction(CopyCard, handler);