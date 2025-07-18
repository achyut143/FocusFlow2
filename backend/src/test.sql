SELECT
    `ProjectModel`.*,
    `scenarioPlans`.`id` AS `scenarioPlans.id`,
    `scenarioPlans`.`project_id` AS `scenarioPlans.projectId`,
    `scenarioPlans`.`scenario_plan_id` AS `scenarioPlans.scenarioPlanId`,
    `scenarioPlans`.`version` AS `scenarioPlans.version`,
    `scenarioPlans`.`operation` AS `scenarioPlans.operation`,
    `scenarioPlans`.`created_by` AS `scenarioPlans.createdBy`,
    `scenarioPlans`.`updated_by` AS `scenarioPlans.updatedBy`,
    `scenarioPlans`.`created_at` AS `scenarioPlans.createdAt`,
    `scenarioPlans`.`updated_at` AS `scenarioPlans.updatedAt`,
    `scenarioPlans`.`deleted_at` AS `scenarioPlans.deletedAt`,
    `tags`.`id` AS `tags.id`,
    `tags`.`name` AS `tags.name`,
    `tags`.`is_active` AS `tags.isActive`,
    `tags`.`description` AS `tags.description`,
    `tags`.`application` AS `tags.application`,
    `tags`.`created_by` AS `tags.createdBy`,
    `tags`.`updated_by` AS `tags.updatedBy`,
    `tags`.`created_at` AS `tags.createdAt`,
    `tags`.`updated_at` AS `tags.updatedAt`,
    `tags`.`deleted_at` AS `tags.deletedAt`,
    `tags->TagProjectJunctionModel`.`id` AS `tags.TagProjectJunctionModel.id`,
    `tags->TagProjectJunctionModel`.`tag_id` AS `tags.TagProjectJunctionModel.tagId`,
    `tags->TagProjectJunctionModel`.`project_id` AS `tags.TagProjectJunctionModel.projectId`,
    `tags->TagProjectJunctionModel`.`created_by` AS `tags.TagProjectJunctionModel.createdBy`,
    `tags->TagProjectJunctionModel`.`updated_by` AS `tags.TagProjectJunctionModel.updatedBy`,
    `tags->TagProjectJunctionModel`.`created_at` AS `tags.TagProjectJunctionModel.createdAt`,
    `tags->TagProjectJunctionModel`.`updated_at` AS `tags.TagProjectJunctionModel.updatedAt`,
    `tags->TagProjectJunctionModel`.`deleted_at` AS `tags.TagProjectJunctionModel.deletedAt`,
    `initiative`.`id` AS `initiative.id`,
    `initiative`.`name` AS `initiative.name`,
    `initiative`.`shield_id` AS `initiative.shieldId`,
    `initiative`.`description` AS `initiative.description`,
    `initiative`.`car_status` AS `initiative.carStatus`,
    `initiative`.`sponsoring_group` AS `initiative.sponsoringGroup`,
    `initiative`.`created_by` AS `initiative.createdBy`,
    `initiative`.`updated_by` AS `initiative.updatedBy`,
    `initiative`.`created_at` AS `initiative.createdAt`,
    `initiative`.`updated_at` AS `initiative.updatedAt`,
    `initiative`.`deleted_at` AS `initiative.deletedAt`,
    `portfolio`.`id` AS `portfolio.id`,
    `portfolio`.`name` AS `portfolio.name`,
    `portfolio`.`created_by` AS `portfolio.createdBy`,
    `portfolio`.`updated_by` AS `portfolio.updatedBy`,
    `portfolio`.`created_at` AS `portfolio.createdAt`,
    `portfolio`.`updated_at` AS `portfolio.updatedAt`,
    `portfolio`.`deleted_at` AS `portfolio.deletedAt`,
    `facilityType`.`id` AS `facilityType.id`,
    `facilityType`.`name` AS `facilityType.name`,
    `facilityType`.`created_by` AS `facilityType.createdBy`,
    `facilityType`.`updated_by` AS `facilityType.updatedBy`,
    `facilityType`.`created_at` AS `facilityType.createdAt`,
    `facilityType`.`updated_at` AS `facilityType.updatedAt`,
    `facilityType`.`deleted_at` AS `facilityType.deletedAt`,
    `projectType`.`id` AS `projectType.id`,
    `projectType`.`name` AS `projectType.name`,
    `projectType`.`created_by` AS `projectType.createdBy`,
    `projectType`.`updated_by` AS `projectType.updatedBy`,
    `projectType`.`created_at` AS `projectType.createdAt`,
    `projectType`.`updated_at` AS `projectType.updatedAt`,
    `projectType`.`deleted_at` AS `projectType.deletedAt`,
    `mile`.`id` AS `mile.id`,
    `mile`.`name` AS `mile.name`,
    `mile`.`created_by` AS `mile.createdBy`,
    `mile`.`updated_by` AS `mile.updatedBy`,
    `mile`.`created_at` AS `mile.createdAt`,
    `mile`.`updated_at` AS `mile.updatedAt`,
    `mile`.`deleted_at` AS `mile.deletedAt`,
    `projectSize`.`id` AS `projectSize.id`,
    `projectSize`.`size` AS `projectSize.size`,
    `projectSize`.`created_by` AS `projectSize.createdBy`,
    `projectSize`.`updated_by` AS `projectSize.updatedBy`,
    `projectSize`.`created_at` AS `projectSize.createdAt`,
    `projectSize`.`updated_at` AS `projectSize.updatedAt`,
    `projectSize`.`deleted_at` AS `projectSize.deletedAt`,
    `assignees`.`id` AS `assignees.id`,
    `assignees`.`name` AS `assignees.name`,
    `assignees`.`email` AS `assignees.email`,
    `assignees`.`shield_id` AS `assignees.shieldId`,
    `assignees`.`created_by` AS `assignees.createdBy`,
    `assignees`.`updated_by` AS `assignees.updatedBy`,
    `assignees`.`role_id` AS `assignees.roleId`,
    `assignees`.`project_id` AS `assignees.projectId`,
    `assignees`.`created_at` AS `assignees.createdAt`,
    `assignees`.`updated_at` AS `assignees.updatedAt`,
    `assignees`.`deleted_at` AS `assignees.deletedAt`
FROM (
    SELECT
        `ProjectModel`.`id`,
        `ProjectModel`.`shield_id` AS `shieldId`,
        `ProjectModel`.`name`,
        `ProjectModel`.`initiative_name` AS `initiativeName`,
        `ProjectModel`.`por_code` AS `porCode`,
        `ProjectModel`.`region`,
        `ProjectModel`.`country`,
        `ProjectModel`.`site`,
        `ProjectModel`.`status`,
        `ProjectModel`.`launch_year` AS `launchYear`,
        `ProjectModel`.`is_confidential` AS `isConfidential`,
        `ProjectModel`.`initiative_id` AS `initiativeId`,
        `ProjectModel`.`project_size_id` AS `projectSizeId`,
        `ProjectModel`.`mile_id` AS `mileId`,
        `ProjectModel`.`project_type_id` AS `projectTypeId`,
        `ProjectModel`.`facility_type_id` AS `facilityTypeId`,
        `ProjectModel`.`portfolio_id` AS `portfolioId`,
        `ProjectModel`.`laminar_link` AS `laminarLink`,
        `ProjectModel`.`created_by` AS `createdBy`,
        `ProjectModel`.`updated_by` AS `updatedBy`,
        `ProjectModel`.`first_receive_date` AS `firstReceiveDate`,
        `ProjectModel`.`is_complete` AS `isComplete`,
        `ProjectModel`.`created_at` AS `createdAt`,
        `ProjectModel`.`updated_at` AS `updatedAt`,
        `ProjectModel`.`deleted_at` AS `deletedAt`
    FROM `project` AS `ProjectModel`
    WHERE (
        `ProjectModel`.`deleted_at` IS NULL
        AND `ProjectModel`.`region` IN ('NA')
    )
    AND (
        SELECT `project_id`
        FROM `scenario_plan_project_junction` AS `scenarioPlans`
        WHERE (
            (`scenarioPlans`.`deleted_at` IS NULL
            AND (
                (`scenarioPlans`.`project_id`, `scenarioPlans`.`version`) IN (
                    SELECT `project_id`, MAX(`version`) as maxVersion
                    FROM `scenario_plan_project_junction`
                    WHERE `scenario_plan_id` = 146
                    GROUP BY `project_id`
                )
                AND `scenarioPlans`.`operation` = 'Add'
                AND `scenarioPlans`.`scenario_plan_id` = 146
            ))
            AND `scenarioPlans`.`project_id` = `ProjectModel`.`id`
        )
        LIMIT 1
    ) IS NOT NULL
    AND (
        SELECT `TagProjectJunctionModel`.`id`
        FROM `tag_project_junction` AS `TagProjectJunctionModel`
        INNER JOIN `tag` AS `TagModel`
            ON `TagProjectJunctionModel`.`tag_id` = `TagModel`.`id`
            AND (`TagModel`.`deleted_at` IS NULL AND `TagModel`.`id` IN (9))
        WHERE (
            `ProjectModel`.`id` = `TagProjectJunctionModel`.`project_id`
            AND (`TagProjectJunctionModel`.`deleted_at` IS NULL)
        )
        LIMIT 1
    ) IS NOT NULL
    ORDER BY `ProjectModel`.`name` ASC
    LIMIT 0, 10
) AS `ProjectModel`
INNER JOIN `scenario_plan_project_junction` AS `scenarioPlans`
    ON `ProjectModel`.`id` = `scenarioPlans`.`project_id`
    AND (
        `scenarioPlans`.`deleted_at` IS NULL
        AND (
            (`scenarioPlans`.`project_id`, `scenarioPlans`.`version`) IN (
                SELECT `project_id`, MAX(`version`) as maxVersion
                FROM `scenario_plan_project_junction`
                WHERE `scenario_plan_id` = 146
                GROUP BY `project_id`
            )
            AND `scenarioPlans`.`operation` = 'Add'
            AND `scenarioPlans`.`scenario_plan_id` = 146
        )
    )
INNER JOIN (
    `tag_project_junction` AS `tags->TagProjectJunctionModel`
    INNER JOIN `tag` AS `tags`
        ON `tags`.`id` = `tags->TagProjectJunctionModel`.`tag_id`
        AND (`tags->TagProjectJunctionModel`.`deleted_at` IS NULL)
) ON `ProjectModel`.`id` = `tags->TagProjectJunctionModel`.`project_id`
    AND (`tags`.`deleted_at` IS NULL AND `tags`.`id` IN (9))
LEFT OUTER JOIN `initiative` AS `initiative`
    ON `ProjectModel`.`initiativeId` = `initiative`.`id`
    AND (`initiative`.`deleted_at` IS NULL)
LEFT OUTER JOIN `portfolio` AS `portfolio`
    ON `ProjectModel`.`portfolioId` = `portfolio`.`id`
    AND (`portfolio`.`deleted_at` IS NULL)
LEFT OUTER JOIN `facility_type` AS `facilityType`
    ON `ProjectModel`.`facilityTypeId` = `facilityType`.`id`
    AND (`facilityType`.`deleted_at` IS NULL)
LEFT OUTER JOIN `project_type` AS `projectType`
    ON `ProjectModel`.`projectTypeId` = `projectType`.`id`
    AND (`projectType`.`deleted_at` IS NULL)
LEFT OUTER JOIN `mile` AS `mile`
    ON `ProjectModel`.`mileId` = `mile`.`id`
    AND (`mile`.`deleted_at` IS NULL)
LEFT OUTER JOIN `project_size` AS `projectSize`
    ON `ProjectModel`.`projectSizeId` = `projectSize`.`id`
    AND (`projectSize`.`deleted_at` IS NULL)
LEFT OUTER JOIN `assignee` AS `assignees`
    ON `ProjectModel`.`id` = `assignees`.`project_id`
    AND (`assignees`.`deleted_at` IS NULL)
ORDER BY `ProjectModel`.`name` ASC;



------


