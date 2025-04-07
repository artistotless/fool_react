/**
 * varibleGap function
 * 
 * Вычисляет отступ между элементами в зависимости от их количества
 * 
 * @param {number[]} gapSizes - Массив размеров, при которых меняется отступ
 * @param {number[]} gapValues - Массив значений отступов
 * @param {number} cardsCount - Текущее количество элементов
 * @returns {number} Вычисленный отступ
 */
export const varibleGap = (
   gapSizes: number[],
   gapValues: number[],
   cardsCount: number
) => {
   let gap = gapValues[0];

   for (let i = 0; i < gapSizes.length; i++) {
      if (cardsCount > gapSizes[i]) {
         gap = gapValues[i + 1];
      }
   }

   return gap;
};

/**
 * getSuitsRows function
 * 
 * Вычисляет количество строк для отображения мастей карты
 * 
 * @param {number} column - Номер колонки
 * @returns {number} Количество строк
 */
export const getSuitsRows = (column: number) => {
   switch (column) {
      case 0:
         return 1;
      case 1:
         return 2;
      case 2:
         return 3;
      case 3:
         return 4;
      case 4:
         return 5;
      case 5:
         return 6;
      case 6:
         return 7;
      case 7:
         return 8;
      case 8:
         return 9;
      default:
         return 0;
   }
}; 