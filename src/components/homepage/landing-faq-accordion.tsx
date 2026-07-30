"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function LandingFaqAccordion({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  return (
    <Accordion>
      {items.map((item, i) => (
        <AccordionItem key={i} className="border-b border-zinc-200/80 py-1">
          <AccordionTrigger className="py-4 text-base font-medium text-zinc-900 hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
