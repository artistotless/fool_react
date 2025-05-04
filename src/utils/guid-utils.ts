import { testMode } from "src/environments/environment";

/**
 * generateGuid function
 * 
 * Генерирует уникальный идентификатор в формате UUID
 * 
 * @returns {string} UUID в формате "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export const generateGuid = (): string => {

    const id = testMode().enabled ? "testActionId" : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    })

    return id;
}; 