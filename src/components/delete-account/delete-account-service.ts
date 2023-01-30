import { snsService } from "../../utils/sns";
import { SnsService } from "../../utils/types";
import { getSNSDeleteTopic } from "../../config";
import { DeleteAccountServiceInterface } from "./types";
import { logger } from "../../utils/logger"

export function deleteAccountService(
    sns: SnsService = snsService()
): DeleteAccountServiceInterface {
    const deleteServiceData = async function (
        user_id: string,
        access_token: string,
        email: string,
        source_ip: string,
        session_id: string,
        persistent_session_id: string,
        public_subject_id: string,
        legacy_subject_id: string,
        topic_arn: string = getSNSDeleteTopic(),
    ): Promise<void> {
        logger.info("Message to publish to SNS:", JSON.stringify({
            "user_id": user_id,
            "access_token": access_token,
            "email": email,
            "source_ip": source_ip,
            "session_id": session_id,
            "persistent_session_id": persistent_session_id,
            "public_subject_id": public_subject_id,
            "legacy_subject_id": legacy_subject_id
        }))
        await sns.publish(topic_arn, JSON.stringify({
            "user_id": user_id,
            "access_token": access_token,
            "email": email,
            "source_ip": source_ip,
            "session_id": session_id,
            "persistent_session_id": persistent_session_id,
            "public_subject_id": public_subject_id,
            "legacy_subject_id": legacy_subject_id
        }))
    };

    return {
        deleteServiceData,
    };
}
