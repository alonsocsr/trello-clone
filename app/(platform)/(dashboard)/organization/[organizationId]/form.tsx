"use client";

import { createBoard } from "@/actions/create-board";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";

export const Form = () => {
  const { execute, fieldErrors } = useAction(createBoard, {
    onSuccess: (data) => {
      console.log(data, "SUCCESS!")
    },
    onError: (error) => {
      console.error(error);
    }
  });

  const onSubmit = (formDara: FormData) => {
    const title = formDara.get("title") as string;

    execute({title});
  }
  return (
    <form action={onSubmit}>
      <div className="flex flex-col space-y-2">
        <FormInput
          id="title"
          errors={fieldErrors}
          label="Board Title"
        />
      </div>
      <FormSubmit>
        Save
      </FormSubmit>
    </form>
  );
};