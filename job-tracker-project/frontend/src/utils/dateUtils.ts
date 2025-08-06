export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const dateFormat = localStorage.getItem('dateFormat') || 'MM/DD/YYYY'
  
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0') 
  const year = date.getFullYear()
  
  switch (dateFormat) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'MM/DD/YYYY':
    default:
      return `${month}/${day}/${year}`
  }
}