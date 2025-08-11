export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


(async () => {
  console.log('start')
  console.time('delay');
  await delay(1000)
  console.timeEnd('delay');
  console.log('end')
})()
