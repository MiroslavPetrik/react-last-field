import { UseFieldOptions } from "form-atoms";
import { useAtomValue } from "jotai";

import { ListAtom, ListAtomItems, ListAtomValue } from "../../atoms/list-atom";
import { ListField } from "../../fields";
import { useListActions } from "../use-list-actions";
import { useListFieldInitialValue } from "../use-list-field-initial-value";

export const useListField = <
  Fields extends ListAtomItems,
  Value extends ListAtomValue<Fields>,
>(
  list: ListField<Fields, Value> | ListAtom<Fields, Value>,
  options?: UseFieldOptions<Value[]>,
) => {
  useListFieldInitialValue(list, options?.initialValue, options);
  const atoms = useAtomValue(list);
  const splitItems = useAtomValue(atoms._splitList);
  const formList = useAtomValue(atoms._formList);
  const formFields = useAtomValue(atoms._formFields);
  const isEmpty = useAtomValue(atoms.empty);
  const { add, move, remove } = useListActions(list);

  const items = splitItems.map((item, index) => ({
    item,
    key: `${formList[index]}`,
    fields: formFields[index]!,
    remove: () => remove(item),
    moveUp: () => move(item, splitItems[index - 1]),
    moveDown: () => move(item, splitItems[index + 2]),
  }));

  return { remove, add, move, isEmpty, items };
};
