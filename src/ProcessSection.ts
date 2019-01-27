export default class ProcessSection {
    public static getvalidateSection(sections: any): any[] {
        // check if there is at least one valid section
        // let jsonObject = JSON.parse(data);
        let validSection: string[] = [];
        if (sections.length === 0) {
            return validSection;
        }
        for (let i in sections) {
            // check if there is at least one valid section
            let aSection = sections[i];
            let keys: string[] = [];
            for (let key in aSection) {
                keys.push(key);
            }
            if (keys.includes("Subject") && keys.includes("Audit") &&
                keys.includes("Professor") && keys.includes("Year")
                && keys.includes("Course") && keys.includes("Fail")
                && keys.includes("Pass") && keys.includes("Title")
                && keys.includes("Avg") && keys.includes("id")) {
                if (aSection.Section === "overall") {
                    aSection.Year = 1900;
                }
                validSection.push(aSection);
            }
        }
        return validSection;
    }
}
