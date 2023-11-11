import argv from 'minimist'
const options = argv(process.argv.slice(2))
//đoạn code trên đem từ index qua ,xóa bên index và xóa log của option luôn
export const isProduction = Boolean(options.production)
