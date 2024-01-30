"use client";

import { ListWithCards } from "@/types";
import { ListForm } from "./list-form";
import { useEffect, useState } from "react";
import { ListItem } from "./list-item";

import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useAction } from "@/hooks/use-action";
import { updateListOrder } from "@/actions/update-list-order";
import { toast } from "sonner";
import { updateCardOrder } from "@/actions/update-card-order";

interface ListContainerProps {
  data: ListWithCards[];
  boardId: string;
};

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export const ListContainer = ({
  data,
  boardId,
} : ListContainerProps) => {
  const [orderedData, setOrderedData] = useState(data);

  const {execute: executeUpdateListOrder } = useAction(updateListOrder, {
    onSuccess: () => {
      toast.success("List reordered");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeUpdateCardOrder} = useAction(updateCardOrder, {
    onSuccess: () => {
      toast.success("List reordered");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  useEffect(() => {
    setOrderedData(data);
  }, [data]);

  const onDragEnd = (result: any) => {
    const { destination, source, type } = result;

    if (!destination) {
      return;
    }

    // if dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // user moves a list
    if (type === "list"){
      const items = reorder(
        orderedData,
        source.index,
        destination.index
      ).map((item, index) => ({...item, order: index}));

      setOrderedData(items);
      executeUpdateListOrder({ items, boardId });
    }

    // user moves a card
    if (type === "card") {
      let newOrderedData = [...orderedData];

      // Source and Destination list
      const sourceList = newOrderedData.find(list => list.id === source.droppableId);
      const destList = newOrderedData.find(list => list.id === destination.droppableId);
      
      if (!sourceList || !destList) {
        return;
      }

      // Check if cards exist on the sourceList, cards is empty
      if (!sourceList.cards) {
        sourceList.cards = [];
      }

      // check if cards exist on the destList
      if (!destList.cards) {
        sourceList.cards = [];
      }

      // moving the card in the same list
      if (source.droppableId === destination.droppableId) {
        const reorderedCards = reorder(
          sourceList.cards,
          source.index,
          destination.index
        );

        reorderedCards.forEach((card, idx) => {
          card.order = idx;
        });

        sourceList.cards = reorderedCards;
        setOrderedData(newOrderedData);
        executeUpdateCardOrder({items: reorderedCards, boardId: boardId});

        //User moves the card to another list
      } else {
        // removed card from the source list
        const [movedCard] = sourceList.cards.splice(source.index, 1);
       
        // Assign the new listId to the moved card
        movedCard.listId = destination.droppableId;
        // Add card to the destination list
        destList.cards.splice(destination.index, 0, movedCard);

        // reorder cards in list
        sourceList.cards.forEach((card, idx) => {
          card.order = idx;
        });

        //Update order for each card in the destination list
        destList.cards.forEach((card, idx) => {
          card.order = idx;
        });

        setOrderedData(newOrderedData);
        executeUpdateCardOrder({items: destList.cards, boardId: boardId});
      }
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="lists" type="list" direction="horizontal">
        {(provided) => (
          <ol
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex gap-x-3 h-full"
          >
            {orderedData.map((list, index) => {
              return (
                <ListItem
                  key = {list.id}
                  index = {index}
                  data = {list}
                />
              )
            })}
            {provided.placeholder}
            <ListForm />
            <div className="flex-shrink w-1" />
          </ol>
        )}
      </Droppable>
    </DragDropContext>
  );
};