function createOptions(datas) {
    const datasList = [];
    Object.keys(datas["values"]).forEach((element) => {
        datasList.push({
            name: element,
            type: "line",
            symbolSize: 8,
            data: datas["values"][element]
        });
    });
    return {
        tooltip: {
            trigger: "axis",
            axisPointer: {
                animation: false
            }
        },
        title: {
            left: 'center',
            text: datas.title
        },
        legend: {
            data: Object.keys(datas["values"]),
            left: 10
        },
        toolbox: {
          show: true,
          feature: {
            dataZoom: {
              yAxisIndex: 'none'
            },
            dataView: { readOnly: true },
            magicType: { type: ['line', 'bar'] },
            restore: {},
            saveAsImage: {}
          }
        },
        axisPointer: {
            link: [
                {
                    xAxisIndex: "all"
                }
            ]
        },
        dataZoom: [
            {
                type: "inside",
                realtime: true,
                start: 50,
                end: 100,
            },
            {
                start: 50,
                end: 100,
            }
        ],
        grid: [
            {
                left: 60,
                right: 50,
                height: "75%"
            }
        ],
        xAxis: [
            {
                type: "category",
                boundaryGap: false,
                axisLine: { onZero: true },
                data: datas["dates"]
            }
        ],
        yAxis: [
            {
                name: datas["keys"][0],
                type: "value"
            }
        ],
        series: datasList
    };
};

function showGraph(value) {
  echarts.dispose(document.getElementById('graph'));
  const myChart = echarts.init(document.getElementById('graph'));
  const option = createOptions(value);
  myChart.on('click', async function(params) {
    if (params.dataIndex) await editDataClicked(value["ids"][params.dataIndex], params);
  });
  myChart.setOption(option);
}

