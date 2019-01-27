import Decimal from "decimal.js";

export default class Apply {
    // Goal: apply the applyToken and key into groupingData and generate the final result for the group
    // Parameters: applyToken, key, groupingData = array of the grouping Data(only passing the value related to key
    // =============================
    // For MAX, MIN, AVG, SUM, COUNT
    // =============================
    // when APPLYTOKEN is MAX:
    // find the max value in groupingData array
    // ex) if groupingData = [90, 80, 95, 85], return 95
    public static applyIsMAX(groupingData: any[]): number {
        // reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max
        return Math.max(...groupingData);
    }
    // when APPLYTOKEN is MIN:
    // find the min value in groupingData array
    // ex) if groupingData = [90, 80, 95, 85], return 80
    public static applyIsMIN(groupingData: any[]): number {
        // reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
        return Math.min(...groupingData);
    }
    // when APPLYTOKEN is AVG:
    // calculte the average of all elements in groupingData array
    // ex) if groupingData = [90, 80, 95, 85], return 87.5
    public static applyIsAVG(groupingData: any[]): number {
        let total: Decimal = new Decimal(0);
        let length = groupingData.length;
        for (let ele of groupingData) {
            let value = new Decimal(ele);
            total = Decimal.add(value, total);
        }
        let avg = total.toNumber() / length;
        return Number(avg.toFixed(2));
    }
    // when APPLYTOKEN is SUM:
    // calculte the sum of all elements in groupingData array
    // ex) if groupingData = [90, 80, 95, 85], return 350
    public static applyIsSUM(groupingData: any): number {
        let total = new Decimal(0);
        for (let ele of groupingData) {
            let value = new Decimal(ele);
            total = Decimal.add(value, total);
        }
        return Number(total.toFixed(2));
    }
    // when APPLYTOKEN is COUNT:
    // count the number of element which is in groupingData Array
    // Reference : https://stackoverflow.com/questions/5667888/counting-the-occurrences-frequency-of-array-elements
    // ex) groupingData = [90, 80, 95, 85], return 4
    public static applyIsCOUNT(groupingData: any[]): number {
        // let countArray: any[] = [];
        let countArray1: number[] = [];
        let index = 0;
        let prev: any = {};
        groupingData.sort();
        for (let ele of groupingData) {
            if (ele !== prev) {
                // countArray.push(ele);
                countArray1.push(1);
            } else {
                countArray1[countArray1.length - 1] ++;
            }
            prev = ele;
            index ++;
        }
        return countArray1.length;
    }

}
