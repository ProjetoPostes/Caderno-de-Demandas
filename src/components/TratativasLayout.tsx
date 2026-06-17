import { Outlet } from "react-router-dom";
import { AppLayout } from "./AppLayout";

export function TratativasLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
