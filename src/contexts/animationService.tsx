import { createRef, MutableRefObject } from "react";

interface AnimationService {
   tableCardsRef: MutableRefObject<{ [id: string]: HTMLElement }>;
   deckRef: MutableRefObject<HTMLElement | null>;
}

const animationService: AnimationService = {
   tableCardsRef: { current: {} },
   deckRef: createRef<HTMLElement>(),
};

export default animationService;
