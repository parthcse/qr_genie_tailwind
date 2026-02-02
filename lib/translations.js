import { useRouter } from "next/router";

export const useTranslation = () => {
  const { locale = "en" } = useRouter();

  return {
    t: (key) => key,
    locale
  };
};
