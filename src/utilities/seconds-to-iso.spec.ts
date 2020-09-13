import "reflect-metadata";
import {secondstoIso} from "./seconds-to-iso";

describe("Seconds to ISO", () => {
    it("Without seconds remaining", () => {
        expect(secondstoIso(120)).toEqual("02:00");
    })
    it("With seconds remaining", () => {
        expect(secondstoIso(121)).toEqual("02:01");
    })
    it("Zeroes", () => {
        expect(secondstoIso(0)).toEqual("00:00");
    })
    it("With hours", () => {
        expect(secondstoIso(3600)).toEqual("01:00:00");
    })
})