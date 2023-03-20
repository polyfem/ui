class ParamPanel{
    div: HTMLDivElement;

    constructor() {
        let div = <HTMLDivElement>document.createElement("div");
        div.className="paramPanel";
        div.style.display="none";
        this.div = div;
    }

    /**
     * Displays the information relevant to the specified geometry
     * @param geometryID
     * @param json
     */
    displayInfo(geometryID: string, json: {}){
        let geometries = json['geometry'];
        let geometry = geometries[geometryID];
        let materialID = geometry['volume_selection'];
        let material = undefined;
        for(let pass of json['materials']){
            if(pass['id']== materialID)
                material = pass;
        }
        this.div.innerText=JSON.stringify(material,null,'\t');
        this.div.style.display="block";
    }
    hideInfo(){
        this.div.style.display="none";
    }
}

export default ParamPanel;