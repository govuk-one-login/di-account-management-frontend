import { expect } from "chai";
import { describe } from "mocha";
import { formatService } from "../../../src/utils/yourServices"
import type { Service } from "../../../src/utils/types";

describe("YourService Util", () => {
    describe("format service information to diplay", () => {
        it("It takes a date epoch in seconds and returns a pretty formatted date", async () => {
            const dateEpochInSeconds = 1673358736;
            const serviceFromDb: Service = {
                client_id : "a_client_id",
                count_successful_logins : 1,
                last_accessed : dateEpochInSeconds,
                last_accessed_readable_format : undefined
            }
    
            const formattedService: Service = formatService(serviceFromDb);
    
            expect(formattedService.client_id).equal("a_client_id");
            expect(formattedService.count_successful_logins).equal(1);
            expect(formattedService.last_accessed_readable_format).equal("10 January 2023");
          });
    
    })
})
 
