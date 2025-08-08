### 解题思路
要高效解决两个有序数组的中位数问题，核心思路是将问题转化为寻找第 k 小元素的问题。通过不断排除不可能的区域，将时间复杂度控制在 O(log(min(m, n))) 级别。以下是关键步骤：

1. **问题转换**：中位数即第 (m+n+1)/2 小的元素（奇数）或中间两个元素的平均值（偶数）。
2. **二分查找**：在较短数组上二分切割点，保证两个数组左半部分合并后覆盖中位数位置。
3. **边界条件**：
   - 确保左半部分元素数量等于总元素的左半部分
   - 处理切割点边界情况（0 或最大位置）
   - 当左半元素都小于右半元素时找到正确切割点

### 优化后代码
```javascript
var findMedianSortedArrays = function(nums1, nums2) {
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

        const nums1Left = i === 0 ? -Infinity : nums1[i-1];
        const nums1Right = i === m ? Infinity : nums1[i];
        const nums2Left = j === 0 ? -Infinity : nums2[j-1];
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
```

### 执行示例
```javascript
console.log(findMedianSortedArrays([1, 3], [2]));       // 输出 2.0
console.log(findMedianSortedArrays([1, 2], [3, 4]));   // 输出 2.5
console.log(findMedianSortedArrays([0, 0], [0, 0]));   // 输出 0.0
```

### 复杂度分析
- **时间复杂度**：O(log(min(m, n))，因为在较短的数组上进行二分搜索
- **空间复杂度**：O(1)，只使用固定大小的额外空间

### 关键优化点
1. **数组交换**：始终保证 nums1 是较短的数组，减少二分搜索次数
2. **边界处理**：使用 ±Infinity 处理切割点在边界的情况
3. **同时检查**：通过一次条件判断同时验证两个数组切割点有效性
4. **直接公式计算**：避免递归和额外的数组切片，提高执行效率

此解法符合题目要求的对数时间复杂度，且通过二分搜索和合理的边界处理，高效解决了两个有序数组的中位数查找问题。