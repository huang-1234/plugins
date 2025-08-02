import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

const SearchBar = () => {
  const handleSearch = (value: string) => {
    console.log('搜索:', value);
  };

  return (
    <Search
      placeholder="搜索文档和内容..."
      allowClear
      enterButton={<SearchOutlined />}
      onSearch={handleSearch}
      style={{ width: 300 }}
    />
  );
};

export default SearchBar;