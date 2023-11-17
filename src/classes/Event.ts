import { IEvent } from "../interfaces/IEvent";
import { Luma } from "./Luma";

export class Event {
    public event: string;
    public execute: Function;
    public once: boolean = false;

    constructor(eventConfig: IEvent) {
        this.event = eventConfig.event;
        this.execute = eventConfig.execute;
        if (eventConfig.once == true) {
            this.once = true
        }
    }

    public setupEvent(luma: Luma) {
        if (this.once) {
            luma.once(this.event, (...args) => {
                this.execute(luma, ...args);
                try {
                    luma.statsTag.increment('processed_events');
                } catch (error) {

                }
            })
        } else {
            luma.on(this.event, (...args) => {
                this.execute(luma, ...args);
                try {
                    luma.statsTag.increment('processed_events');
                } catch (error) {

                }
            })
        }
    }

}