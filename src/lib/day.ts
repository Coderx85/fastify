import dayjs, { Dayjs } from "dayjs";

export function getCurrentDate(): Date {
  return new Date();
}

export function getCurrentDayjs(): Dayjs {
  return dayjs();
}

export function formatDate(date: Date): string {
  return dayjs(date).format("MMMM D, YYYY");
}
