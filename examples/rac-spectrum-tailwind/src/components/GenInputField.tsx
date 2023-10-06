import { useState } from "react";
import { Input, Group, TextField, Button } from "react-aria-components";

export function GenInputField() {
  let [value, setValue] = useState("");
  let [isTextFieldFocused, setIsTextFieldFocused] = useState(false);
  return (
    <Group
      className={`flex m-auto align-middle bg-white border rounded-full shadow-md h-800 w-[80%] ${
        isTextFieldFocused ? "ring" : ""
      }`}
    >
      <TextField
        onFocus={() => setIsTextFieldFocused(true)}
        onBlur={() => setIsTextFieldFocused(false)}
        value={value}
        onChange={setValue}
        aria-label="Prompt"
        className="flex-grow h-full p-150"
      >
        <Input className="w-full h-full text-xl font-semibold text-black p-50 focus:outline-none" />
      </TextField>
      <Button
        isDisabled={value === ""}
        className="self-end my-auto font-semibold text-white rounded-full disabled:bg-gray-300 disabled:text-gray-500 mx-200 bg-accent-800 p-150 focus-visible:ring focus:outline-none"
      >
        Generate
      </Button>
    </Group>
  );
}
