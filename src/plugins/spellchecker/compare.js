import * as Diff from 'diff'

function getDiff(originalText, text) {
  const diff = Diff.diffWordsWithSpace(originalText, text)
  let baseIndex = 0
  let originalEndIndex = 0
  let originalStartIndex = 0

  const diffWithIndex = diff.map(part => {
    originalStartIndex = originalEndIndex
    if (part.added) {
      baseIndex += part.value.length
    } else if (part.removed) {
      baseIndex -= part.value.length
      originalEndIndex += part.value.length
    } else {
      originalEndIndex += part.value.length
    }
    return { ...part, baseIndex, originalStartIndex, originalEndIndex }
  })
  return diffWithIndex
}



const getNewCorrections = (originalText, text, corrections) => {
  if (originalText === text) return corrections
  
  const diff = getDiff(originalText, text)

  return diff.map(({ baseIndex, originalStartIndex, originalEndIndex, value, removed, added }) => {
    if (removed) return []
    return corrections.map(item => {
      const { startIndex, endIndex, ...rest } = item
      if (originalStartIndex <= item.startIndex && originalEndIndex >= item.endIndex) {
        return {
          ...rest,
          startIndex: baseIndex + startIndex,
          endIndex: endIndex + baseIndex
        }
      } else return null
  
    })
  }).reduce((prev, curr) => [...prev, ...curr], []).filter(Boolean)
}


 export default getNewCorrections


