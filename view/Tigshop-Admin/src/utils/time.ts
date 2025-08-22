import dayjs from "dayjs"
export function formatTimestamp(timestamp: any) {
  var date = new Date(timestamp * 1000);

  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var day = ('0' + date.getDate()).slice(-2);

  var hours = ('0' + date.getHours()).slice(-2);
  var minutes = ('0' + date.getMinutes()).slice(-2);
  var seconds = ('0' + date.getSeconds()).slice(-2);

  var formattedDate = year + '-' + month + '-' + day;
  var formattedTime = hours + ':' + minutes + ':' + seconds;

  return formattedDate + ' ' + formattedTime;
}
export const formatTime = (date: Date, hours: number) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  startOfDay.setHours(startOfDay.getHours() + hours);
  return startOfDay.getTime();
};
export function getDaysLaterEndTime(days: number): number {
  const currentDate = new Date();
  const targetDate = new Date(currentDate);
  targetDate.setDate(currentDate.getDate() + days);
  targetDate.setHours(23, 59, 59, 999);
  return targetDate.getTime();
}

export function formattedDate(date: any, type?: string) {
  return dayjs(date).format(type || 'YYYY-MM-DD HH:mm:ss')
}


export const formatDuration = (seconds: number, forceHours = false): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  // 不需要小时且小时为0时，显示MM:SS
  if (!forceHours && hrs === 0) {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // 显示HH:MM:SS
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};