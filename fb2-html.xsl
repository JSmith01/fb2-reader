<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:fb="http://www.gribuser.ru/xml/fictionbook/2.0">
    <xsl:output method="html" encoding="utf-8"/>
    <xsl:param name="saveimages" select="2"/>
    <xsl:param name="tocdepth" select="3"/>
    <xsl:param name="toccut" select="1"/>
    <xsl:param name="skipannotation" select="1"/>
    <xsl:param name="NotesTitle" select="'Сноски'"/>

    <!-- author -->
    <xsl:template name="author">
        <xsl:value-of select="fb:first-name"/>
        <xsl:text disable-output-escaping="no">&#032;</xsl:text>
        <xsl:value-of select="fb:middle-name"/>&#032;
        <xsl:text disable-output-escaping="no">&#032;</xsl:text>
        <xsl:value-of select="fb:last-name"/>
        <br/>
    </xsl:template>

    <!-- sequence -->
    <xsl:template name="sequence">
        <xsl:value-of select="@name"/>
        <xsl:if test="@number">
            <xsl:text disable-output-escaping="no">,&#032;#</xsl:text>
            <xsl:value-of select="@number"/>
        </xsl:if>
    </xsl:template>

    <!-- toc template: body -->
    <xsl:template match="fb:body" mode="toc">
        <xsl:choose>
            <xsl:when test="not(@name) or @name != 'notes'"><xsl:apply-templates mode="toc" select="fb:section"/></xsl:when>
            <xsl:otherwise><br/><li><a href="#TOC_notes_{generate-id()}"><xsl:value-of select="$NotesTitle"/></a></li></xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <!-- toc template: section -->
    <xsl:template match="fb:section" mode="toc">
        <xsl:if test="fb:title | .//fb:section[count(ancestor::fb:section) &lt; $tocdepth]/fb:title">
            <li>
                <xsl:apply-templates select="fb:title" mode="toc"/>
                <xsl:if test="(.//fb:section/fb:title) and (count(ancestor::fb:section) &lt; $tocdepth or $tocdepth=4)">
                    <UL class="section-toc"><xsl:apply-templates select="fb:section" mode="toc"/></UL>
                </xsl:if>
            </li>
        </xsl:if>
    </xsl:template>

    <!-- toc template: title -->
    <xsl:template match="fb:title" mode="toc">
        <a href="#TOC_{generate-id()}">
            <xsl:choose>
                <xsl:when test="$toccut &gt; 0">
                    <xsl:value-of select="normalize-space(fb:p[1])"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:for-each select="fb:title/fb:p">
                        <xsl:if test="position()>1"><xsl:text> </xsl:text></xsl:if>
                        <xsl:value-of select="normalize-space(.)"/>
                    </xsl:for-each>
                </xsl:otherwise>
            </xsl:choose>
        </a>
    </xsl:template>

    <!-- description -->
    <xsl:template match="fb:description">
        <xsl:apply-templates/>
    </xsl:template>

    <!-- section -->
    <xsl:template match="fb:section">
        <xsl:call-template name="preexisting_id"/>
        <xsl:apply-templates select="fb:title"/>
        <section><xsl:apply-templates select="fb:*[name()!='title']"/></section>
    </xsl:template>

    <!-- title -->
    <xsl:template match="fb:section/fb:title|fb:poem/fb:title">
        <xsl:choose>
            <xsl:when test="ancestor::fb:body/@name = 'notes' and not(following-sibling::fb:section)">
                <xsl:call-template name="preexisting_id"/>
                <xsl:for-each select="parent::fb:section">
                    <xsl:call-template name="preexisting_id"/>
                </xsl:for-each><strong><xsl:apply-templates/></strong>
            </xsl:when>
            <xsl:otherwise>
                <xsl:choose>
                    <xsl:when test="count(ancestor::node()) &lt; 9">
                        <xsl:element name="{concat('h',count(ancestor::node())-3)}">
                            <xsl:attribute name="align">center</xsl:attribute>
                            <a name="TOC_{generate-id()}"></a>
                            <xsl:call-template name="preexisting_id"/>
                            <xsl:apply-templates/>
                        </xsl:element>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:element name="h6">
                            <xsl:call-template name="preexisting_id"/>
                            <xsl:apply-templates/>
                        </xsl:element>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <!-- body/title -->
    <xsl:template match="fb:body/fb:title">
        <h1><xsl:apply-templates/></h1>
    </xsl:template>

    <!-- title/p and the like -->
    <xsl:template match="fb:title/fb:p|fb:title-info/fb:book-title">
        <span><xsl:apply-templates/></span>
    </xsl:template>


    <!-- subtitle -->
    <xsl:template match="fb:subtitle">
        <xsl:call-template name="preexisting_id"/>
        <h5 class="subtitle">
            <xsl:apply-templates/>
        </h5>
    </xsl:template>


    <!-- p -->
    <xsl:template match="fb:p">
        <p class="p"><xsl:call-template name="preexisting_id"/><xsl:apply-templates/></p>
    </xsl:template>

    <!-- strong -->
    <xsl:template match="fb:strong">
        <b><xsl:apply-templates/></b>
    </xsl:template>

    <!-- emphasis -->
    <xsl:template match="fb:emphasis">
        <i><xsl:apply-templates/></i>
    </xsl:template>

    <!-- style -->
    <xsl:template match="fb:style">
        <span class="{@name}"><xsl:apply-templates/></span>
    </xsl:template>

    <!-- empty-line -->
    <xsl:template match="fb:empty-line">
        &#160;<br/>
    </xsl:template>

    <!-- link -->
    <xsl:template match="fb:a">
        <xsl:element name="a">
            <xsl:attribute name="href"><xsl:value-of select="@xlink:href"/></xsl:attribute>
            <xsl:attribute name="title">
                <xsl:choose>
                    <xsl:when test="starts-with(@xlink:href,'#')"><xsl:value-of select="key('note-link',substring-after(@xlink:href,'#'))/fb:p"/></xsl:when>
                    <xsl:otherwise><xsl:value-of select="key('note-link',@xlink:href)/fb:p"/></xsl:otherwise>
                </xsl:choose>
            </xsl:attribute>
            <xsl:choose>
                <xsl:when test="(@type) = 'note'">
                    <sup>
                        <xsl:apply-templates/>
                    </sup>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:apply-templates/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:element>
    </xsl:template>

    <!-- annotation -->
    <xsl:template name="annotation">
        <xsl:call-template name="preexisting_id"/>
        <h3>Annotation</h3>
        <xsl:apply-templates/>
    </xsl:template>

    <!-- epigraph -->
    <xsl:template match="fb:epigraph">
        <div class="epigraph">
            <xsl:call-template name="preexisting_id"/>
            <xsl:apply-templates/>
        </div>
    </xsl:template>

    <!-- epigraph/text-author -->
    <xsl:template match="fb:epigraph/fb:text-author">
        <div class="epigraph-author"><xsl:apply-templates/></div>
    </xsl:template>

    <!-- cite -->
    <xsl:template match="fb:cite">
        <div class="cite">
            <xsl:call-template name="preexisting_id"/>
            <xsl:apply-templates/>
        </div>
    </xsl:template>

    <!-- cite/text-author -->
    <xsl:template match="fb:text-author">
        <blockquote class="cite-author"><i><xsl:apply-templates/></i></blockquote>
    </xsl:template>

    <!-- date -->
    <xsl:template match="fb:date">
        <xsl:choose>
            <xsl:when test="not(@value)">
                <div class="fb-date"><xsl:apply-templates/></div>
            </xsl:when>
            <xsl:otherwise>
                <div class="fb-date"><xsl:value-of select="@value"/></div>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <!-- poem -->
    <xsl:template match="fb:poem">
        <blockquote class="poem">
            <xsl:call-template name="preexisting_id"/>
            <xsl:apply-templates/>
        </blockquote>
    </xsl:template>

    <!-- stanza -->
    <xsl:template match="fb:stanza">
        <div class="stanza">
            <xsl:apply-templates/>
        </div>
    </xsl:template>

    <!-- v -->
    <xsl:template match="fb:v">
        <xsl:call-template name="preexisting_id"/>
        <div class="stanza-v">
            <xsl:apply-templates/>
        </div>
    </xsl:template>

    <!-- image - inline -->
    <xsl:template match="fb:p/fb:image|fb:v/fb:image|fb:td/fb:image|fb:subtitle/fb:image">
        <xsl:if test="$saveimages &gt; 0">
            <img>
                <xsl:choose>
                    <xsl:when test="starts-with(@xlink:href,'#')">
                        <xsl:attribute name="data-src"><xsl:value-of select="substring-after(@xlink:href,'#')"/></xsl:attribute>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:attribute name="src"><xsl:value-of select="@xlink:href"/></xsl:attribute>
                    </xsl:otherwise>
                </xsl:choose>
            </img>
        </xsl:if>
    </xsl:template>

    <!-- image - block -->
    <xsl:template match="fb:image">
        <xsl:if test="$saveimages &gt; 0">
            <div class="image-block">
                <img>
                    <xsl:choose>
                        <xsl:when test="starts-with(@xlink:href,'#')">
                            <xsl:attribute name="data-src"><xsl:value-of select="substring-after(@xlink:href,'#')"/></xsl:attribute>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:attribute name="src"><xsl:value-of select="@xlink:href"/></xsl:attribute>
                        </xsl:otherwise>
                    </xsl:choose>
                </img>
            </div>
        </xsl:if>
    </xsl:template>

    <!-- we preserve used ID's and drop unused ones -->
    <xsl:template name="preexisting_id">
        <xsl:variable name="i" select="@id"/>
        <xsl:if test="@id and //fb:a[@xlink:href=concat('#',$i)]"><a name="{@id}"/></xsl:if>
    </xsl:template>

    <!-- book generator -->
    <xsl:template name="DocGen">
        <xsl:for-each select="fb:body">
            <xsl:if test="position()!=1">
                <hr/>
            </xsl:if>
            <xsl:choose>
                <xsl:when test="@name = 'notes'"><h4><a name="#TOC_notes_{generate-id()}"/><xsl:value-of select="$NotesTitle"/></h4></xsl:when>
                <xsl:when test="@name"><h4><xsl:value-of select="@name"/></h4></xsl:when>
            </xsl:choose>
            <!-- <xsl:apply-templates /> -->
            <article><xsl:apply-templates/></article>
        </xsl:for-each>
    </xsl:template>

    <xsl:key name="note-link" match="fb:section" use="@id"/>
    <xsl:template match="/*">
        <html>
            <head>
                <title>
                    <xsl:value-of select="fb:description/fb:title-info/fb:book-title"/>
                </title>
            </head>
            <body><main class="book-wrapper">
                <xsl:apply-templates select="fb:description/fb:title-info/fb:coverpage/fb:image"/>
                <h1><xsl:apply-templates select="fb:description/fb:title-info/fb:book-title"/></h1>
                <h2>
                    <small>
                        <xsl:for-each select="fb:description/fb:title-info/fb:author">
                            <b>
                                <xsl:call-template name="author"/>
                            </b>
                        </xsl:for-each>
                    </small>
                </h2>
                <xsl:if test="fb:description/fb:title-info/fb:sequence">
                    <xsl:for-each select="fb:description/fb:title-info/fb:sequence">
                        <p class="sequence"><xsl:call-template name="sequence"/></p>
                    </xsl:for-each>
                </xsl:if>
                <xsl:if test="$skipannotation = 0">
                    <xsl:for-each select="fb:description/fb:title-info/fb:annotation">
                        <div class="annotation">
                            <xsl:call-template name="annotation"/>
                        </div>
                        <hr/>
                    </xsl:for-each>
                </xsl:if>
                <!-- BUILD TOC -->
                <xsl:if test="$tocdepth &gt; 0 and count(//fb:body[not(@name) or @name != 'notes']//fb:title) &gt; 1">
                    <hr/>
                    <div class="toc">
                        <ul>
                            <xsl:apply-templates select="fb:body" mode="toc"/>
                        </ul>
                    </div>
                </xsl:if>
                <!-- BUILD BOOK -->
                <div class="book-content">
                    <xsl:call-template name="DocGen"/>
                </div>
            </main></body>
        </html>
    </xsl:template>
</xsl:stylesheet>
