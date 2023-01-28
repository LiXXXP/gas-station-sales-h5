const selectData = {
  tagList: [ // 标签列表
    {
      title: '广告大屏',
      tags: [
        {
          tagId: '2',
          tagName: '100寸以上'
        },
        {
          tagId: '4',
          tagName: '120寸以上'
        },
        {
          tagId: '8',
          tagName: '150寸以上'
        },
        {
          tagId: '1',
          tagName: '无'
        },
      ],
    },
    {
      title: '标签选择',
      tags: [],
    },
    {
      title: '加油站星级',
      tags: [
        {
          tagId: '4',
          tagName: '三星级'
        },
        {
          tagId: '8',
          tagName: '四星级'
        },
        {
          tagId: '16',
          tagName: '五星级'
        }
      ],
    },
    {
      title: '经营状况',
      tags: [
        {
          tagId: '1',
          tagName: '正常营业'
        },
        {
          tagId: '2',
          tagName: '装修'
        },
        {
          tagId: '4',
          tagName: '停业'
        }
      ],
    },
    {
      title: '品牌选择',
      tags: [
        {
          tagId: '1',
          tagName: '中国石化'
        }
      ],
    },
  ],
  tagSelectList: [ // 选择的标签结果列表，存放标签id
    {
      selected: [] as Array<string> // 广告大屏
    },
    {
      selected: [] as Array<string> // 标签选择
    },
    {
      selected: [] as Array<string> // 加油站星级
    },
    {
      selected: [] as Array<string> // 经营状况
    },
    {
      selected: [] as Array<string> // 品牌选择
    }
  ]
}

export default selectData