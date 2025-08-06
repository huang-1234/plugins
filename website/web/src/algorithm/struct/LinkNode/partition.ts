
  // 示例测试
  class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val: number) {
      this.val = val;
      this.next = null;
    }
  }
function partition(head: ListNode, x: number) {
  if (!head || !head.next) return head;

  // 初始化六个指针：小/等/大三部分的头尾指针
  let sH = null, sT = null; // 小于 x 的链表
  // let eH = null, eT = null; // 等于 x 的链表（本题只需小于和大于，但保留等号部分以通用）
  let bH = null, bT = null; // 大于等于 x 的链表
  let cur = head;

  // 遍历原链表，将节点分配到三个子链表
  while (cur) {
    const next = cur.next;
    cur.next = null;  // 断开当前节点

    if (cur.val < x) {
      if (!sH) {
        sH = cur;
        sT = cur;
      } else {
        sT!.next = cur;
        sT = sT!.next;
      }
    } else {  // 本题只需区分 <x 和 >=x
      if (!bH) {
        bH = cur;
        bT = cur;
      } else {
        bT!.next = cur;
        bT = bT!.next;
      }
    }
    cur = next!;
  }

  // 合并子链表：小于部分 + 大于等于部分
  if (!sH) return bH;         // 无小于部分时直接返回大于部分
  if (bH) sT!.next = bH;        // 连接小于和大于部分
  return sH;
}




(function main() {
  const head = new ListNode(1);
  head.next = new ListNode(4);
  head.next.next = new ListNode(3);
  head.next.next.next = new ListNode(2);
  head.next.next.next.next = new ListNode(5);
  head.next.next.next.next.next = new ListNode(2);
  const x = 3;
  const result = partition(head, x);
  console.log(result);
})()