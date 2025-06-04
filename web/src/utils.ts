export type Dict = {
  [key: string]: Dict
}

export function shortuuid() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function splitContent(
  content: string,
  start?: string,
  end?: string
): [string, string, string] {
  if (!start) return [content, '', '']

  const splitStart = content.split(start)
  const _beforeStart = splitStart[0]
  splitStart.splice(0, 1)
  const _afterStart = splitStart.join('')

  if (_afterStart == '' || !end) return [_beforeStart, '', _afterStart]

  const splitEnd = _afterStart.split(end)
  const lastIndex = splitEnd.length - 1 || 1
  const _inside = splitEnd.splice(0, lastIndex).join('')
  const _afterEnd = splitEnd.join('')

  return [_beforeStart, _inside, _afterEnd]
}
