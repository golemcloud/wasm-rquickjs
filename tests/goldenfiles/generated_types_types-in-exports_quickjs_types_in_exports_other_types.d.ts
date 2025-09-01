declare module 'quickjs:types-in-exports/other-types' {
  /**
   * An example type alias
   */
  export type ListOfStrings = string[];
  export type Rec2 = {
    x: number;
    y: number;
  };
  /**
   * An example enum
   */
  export type Color = "red" | "green" | "blue";
}
