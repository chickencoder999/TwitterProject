//hàm xử lý enum đc mảng các số của enum
export const numberEnumToArray = (numberEnum: { [key: string]: string | number }) => {
  return Object.values(numberEnum).filter(
    (value) => typeof value === 'number'
  ) as number[]
}
