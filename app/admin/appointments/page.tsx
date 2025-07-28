import AppointmentsClient from "@/components/admin/AppointmentsClient";

interface Props {
  searchParams: {
    search?: string;
    date?: string;
    status?: string;
    sort?: string;
  };
}

const AppointmentsPage = ({ searchParams }: Props) => {
  return (
    <AppointmentsClient
      search={searchParams.search}
      date={searchParams.date}
      status={searchParams.status}
      sort={searchParams.sort}
    />
  );
};

export default AppointmentsPage;
