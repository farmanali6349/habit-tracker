import { createElement, type ComponentProps } from "react";
import { getCategoryIcon } from "@/lib/categories";

type CategoryIconProps = ComponentProps<"svg"> & { name: string };

export default function CategoryIcon({ name, ...props }: CategoryIconProps) {
  return createElement(getCategoryIcon(name), props);
}
