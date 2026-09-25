import { useRouteParamAsInt } from "@/app/routes";
import { PageUser } from "@/components/pages/PageUser";

export default function Page() {
  const id = useRouteParamAsInt("id");

  return <PageUser userId={id} />;
}
