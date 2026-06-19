"use client";

import { useEffect, useState } from "react";

export interface CodebookItem {
  _id: string;
  value: string;
}

export function useCodebook(type: "profileType" | "department") {
  const [items, setItems] = useState<CodebookItem[]>([]);

  function reload() {
    fetch(`/api/codebook?type=${type}`)
      .then((r) => r.json())
      .then((data: CodebookItem[]) => setItems(data));
  }

  useEffect(() => { reload(); }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  return { items, values: items.map((i) => i.value), reload };
}
