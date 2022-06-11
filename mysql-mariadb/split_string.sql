DROP FUNCTION IF EXISTS SPLIT_STRING;

DELIMITER $

CREATE FUNCTION
   SPLIT_STRING ( PsCadena VARCHAR(1024) , PsDelimitador CHAR(1) , PiPosicion INT)
   RETURNS VARCHAR(1024)
   DETERMINISTIC -- always returns same results for same input parameters
    BEGIN

        DECLARE items INT ;

        -- get max number of items
        SET items = LENGTH(PsCadena) - LENGTH(REPLACE(PsCadena, PsDelimitador, '')) + 1;

        IF PiPosicion > items THEN
            RETURN NULL ;
        ELSE
            RETURN SUBSTRING_INDEX(SUBSTRING_INDEX(PsCadena, PsDelimitador, PiPosicion) , PsDelimitador , -1 ) ;
        END IF;

    END
$

DELIMITER ;