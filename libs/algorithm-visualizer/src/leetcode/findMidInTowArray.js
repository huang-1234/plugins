var findMedianSortedArrays = function (nums1, nums2) {
  // 确保nums1是较短的数组
  if (nums1.length > nums2.length) {
    [nums1, nums2] = [nums2, nums1];
  }

  const m = nums1.length;
  const n = nums2.length;
  const totalLeft = Math.floor((m + n + 1) / 2);

  // 在较短的数组nums1上做二分搜索
  let left = 0;
  let right = m;

  while (left <= right) {
    const i = Math.floor((left + right) / 2);
    const j = totalLeft - i;

    const nums1Left = i === 0 ? -Infinity : nums1[i - 1];
    const nums1Right = i === m ? Infinity : nums1[i];
    const nums2Left = j === 0 ? -Infinity : nums2[j - 1];
    const nums2Right = j === n ? Infinity : nums2[j];

    if (nums1Left <= nums2Right && nums2Left <= nums1Right) {
      const maxLeft = Math.max(nums1Left, nums2Left);
      if ((m + n) % 2 === 1) return maxLeft;
      const minRight = Math.min(nums1Right, nums2Right);
      return (maxLeft + minRight) / 2;
    } else if (nums1Left > nums2Right) {
      right = i - 1;
    } else {
      left = i + 1;
    }
  }

  return 0; // 代码逻辑不会走到这里
};

console.log(findMedianSortedArrays([1, 3], [2]));       // 输出 2.0
console.log(findMedianSortedArrays([1, 2], [3, 4]));   // 输出 2.5
console.log(findMedianSortedArrays([0, 0], [0, 0]));   // 输出 0.0