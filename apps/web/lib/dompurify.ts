import isomorphicDompurify from "isomorphic-dompurify";

export const DOMPurify = {
  sanitize(input: string): string {
    return isomorphicDompurify.sanitize(input);
  }
};
