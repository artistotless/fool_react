import { useRef } from "react";

export interface AnimationOptions {
   animationDuration: number;
   onStart?: () => void;
   onFinish?: () => void;
}

export interface AnimateElementOptions {
   fromElement?: HTMLElement | string;
   toElement: HTMLElement | string;
   animationOptions: AnimationOptions;
}

const getDOMElement = (element: HTMLElement | string): HTMLElement => {
   if (typeof element === "string") {
      const node = document.getElementById(element);
      if (!node) {
         throw new Error(`Element with id "${element}" not found`);
      }
      return node;
   }
   return element;
};

const getElementPosition = (element: HTMLElement) => {
   const rect = element.getBoundingClientRect();
   return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
   };
};

const useAnimateElement = () => {
   const requestAnimationFrameRef = useRef<number | null>(null);

   const animateElement = (
      element: HTMLElement,
      options: AnimateElementOptions
   ) => {
      const { fromElement, toElement, animationOptions } = options;
      const { animationDuration, onStart, onFinish } = animationOptions;

      const from = getElementPosition(
         getDOMElement(fromElement ? fromElement : element)
      );
      const to = getElementPosition(getDOMElement(toElement));

      let startTime = 0;

      const animate = (timestamp: number) => {
         if (!startTime) {
            startTime = timestamp;
            element.style.position = "absolute";
            onStart?.();
         }

         let progress = (timestamp - startTime) / animationDuration;

         if (progress > 1) {
            progress = 1;
         }

         const x = from.x + (to.x - from.x) * progress;
         const y = from.y + (to.y - from.y) * progress;
         const width = from.width + (to.width - from.width) * progress;
         const height = from.height + (to.height - from.height) * progress;

         element.style.left = `${x}px`;
         element.style.top = `${y}px`;
         element.style.width = `${width}px`;
         element.style.height = `${height}px`;

         if (progress > 0.8) {
            element.style.opacity = "0";
         }

         if (progress < 1) {
            requestAnimationFrameRef.current = requestAnimationFrame(animate);
         } else {
            onFinish?.();
            setTimeout(() => {
               element.remove();
            }, 500);
         }
      };

      requestAnimationFrameRef.current = requestAnimationFrame(animate);

      return () => {
         if (requestAnimationFrameRef.current) {
            cancelAnimationFrame(requestAnimationFrameRef.current);
         }
      };
   };

   return animateElement;
};

export default useAnimateElement;

export const animateElements = (
   elements: {
      [id: string]: HTMLElement;
   },
   animationOptions: AnimateElementOptions,
   animateFunc: (element: HTMLElement, options: AnimateElementOptions) => void
) => {
   const animationPromises = Object.values(elements).map((element) => {
      return new Promise<void>((resolve) => {
         animateFunc(element, {
            ...animationOptions,
            animationOptions: {
               ...animationOptions.animationOptions,
               onFinish: () => {
                  resolve();
               },
            },
         });
      });
   });

   return Promise.all(animationPromises);
};
